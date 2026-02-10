import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {User} from './entities/user.entity';
import {CreateUserInput} from './dto/create-user.input';
import {UpdateUserInput} from './dto/update-user.input';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  create(input: CreateUserInput): Promise<User> {
    const user = this.userRepository.create(input);
    return this.userRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({id});
  }

  findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({username});
  }

  async update(input: UpdateUserInput): Promise<User> {
    await this.userRepository.update(input.id, input);
    return this.userRepository.findOneByOrFail({id: input.id});
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);

    return !!result.affected;
  }
}
